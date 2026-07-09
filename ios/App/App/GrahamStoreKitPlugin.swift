import Foundation
import Capacitor
import StoreKit

@objc(GrahamStoreKitPlugin)
public class GrahamStoreKitPlugin: CAPPlugin, CAPBridgedPlugin, SKProductsRequestDelegate, SKPaymentTransactionObserver {
    public let identifier = "GrahamStoreKitPlugin"
    public let jsName = "GrahamStoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchaseLegacy", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]
    private var legacyPurchaseCall: CAPPluginCall?
    private var legacyPurchaseRequest: SKProductsRequest?
    private var legacyPurchaseProductIdentifier: String?
    private var legacyPurchaseTimeout: DispatchWorkItem?

    public override func load() {
        SKPaymentQueue.default().add(self)
    }

    deinit {
        SKPaymentQueue.default().remove(self)
    }

    @objc func products(_ call: CAPPluginCall) {
        guard let productIdentifiers = call.getArray("productIdentifiers", String.self), !productIdentifiers.isEmpty else {
            call.reject("Must provide productIdentifiers", "MISSING_PRODUCT_IDENTIFIERS")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: productIdentifiers)
                call.resolve([
                    "products": products.map { productPayload($0) }
                ])
            } catch {
                call.reject("Unable to load Apple subscription products", "PRODUCTS_FAILED", error)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productIdentifier = call.getString("productIdentifier"), !productIdentifier.isEmpty else {
            call.reject("Must provide productIdentifier", "MISSING_PRODUCT_IDENTIFIER")
            return
        }

        Task { @MainActor in
            do {
                let products = try await Product.products(for: [productIdentifier])
                guard let product = products.first else {
                    call.reject("Apple subscription product was not found: \(productIdentifier)", "PRODUCT_NOT_FOUND")
                    return
                }

                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        call.resolve([
                            "purchased": true,
                            "pending": false,
                            "productIdentifier": transaction.productID,
                            "transactionId": String(transaction.id)
                        ])
                    case .unverified(_, let error):
                        call.reject("Apple could not verify this purchase", "UNVERIFIED_TRANSACTION", error)
                    }
                case .pending:
                    call.resolve([
                        "purchased": false,
                        "pending": true,
                        "productIdentifier": product.id
                    ])
                case .userCancelled:
                    call.reject("Purchase cancelled", "USER_CANCELLED")
                @unknown default:
                    call.reject("Unknown Apple purchase result", "UNKNOWN_PURCHASE_RESULT")
                }
            } catch {
                call.reject("Apple purchase failed", "PURCHASE_FAILED", error)
            }
        }
    }

    @objc func purchaseLegacy(_ call: CAPPluginCall) {
        guard let productIdentifier = call.getString("productIdentifier"), !productIdentifier.isEmpty else {
            call.reject("Must provide productIdentifier", "MISSING_PRODUCT_IDENTIFIER")
            return
        }

        DispatchQueue.main.async {
            guard SKPaymentQueue.canMakePayments() else {
                call.reject("In-app purchases are disabled on this device", "PAYMENTS_DISABLED")
                return
            }

            guard self.legacyPurchaseCall == nil else {
                call.reject("A purchase is already in progress", "PURCHASE_ALREADY_IN_PROGRESS")
                return
            }

            self.legacyPurchaseCall = call
            self.legacyPurchaseProductIdentifier = productIdentifier
            let request = SKProductsRequest(productIdentifiers: Set([productIdentifier]))
            self.legacyPurchaseRequest = request
            request.delegate = self
            request.start()

            let timeout = DispatchWorkItem { [weak self] in
                guard let self = self, let pendingCall = self.legacyPurchaseCall else { return }
                self.legacyPurchaseRequest?.cancel()
                pendingCall.reject("Apple subscription product is not available: \(productIdentifier)", "PRODUCT_NOT_AVAILABLE")
                self.clearLegacyPurchaseState()
            }
            self.legacyPurchaseTimeout = timeout
            DispatchQueue.main.asyncAfter(deadline: .now() + 12, execute: timeout)
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        let requestedIdentifiers = call.getArray("productIdentifiers", String.self) ?? []
        let requestedSet = Set(requestedIdentifiers)

        Task {
            do {
                try await AppStore.sync()
                var activeProductIdentifiers: [String] = []

                for await entitlement in Transaction.currentEntitlements {
                    if case .verified(let transaction) = entitlement {
                        if requestedSet.isEmpty || requestedSet.contains(transaction.productID) {
                            activeProductIdentifiers.append(transaction.productID)
                        }
                    }
                }

                call.resolve([
                    "restored": !activeProductIdentifiers.isEmpty,
                    "productIdentifiers": Array(Set(activeProductIdentifiers))
                ])
            } catch {
                call.reject("Unable to restore Apple purchases", "RESTORE_FAILED", error)
            }
        }
    }

    private func productPayload(_ product: Product) -> [String: Any] {
        return [
            "id": product.id,
            "displayName": product.displayName,
            "description": product.description,
            "displayPrice": product.displayPrice,
            "price": product.price.description
        ]
    }

    public func productsRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {
        DispatchQueue.main.async {
            guard let legacyRequest = self.legacyPurchaseRequest,
                  request === legacyRequest,
                  let call = self.legacyPurchaseCall else { return }

            self.legacyPurchaseTimeout?.cancel()
            self.legacyPurchaseTimeout = nil

            guard let product = response.products.first else {
                let invalidIds = response.invalidProductIdentifiers.joined(separator: ",")
                call.reject("Apple subscription product is not available: \(self.legacyPurchaseProductIdentifier ?? invalidIds)", "PRODUCT_NOT_AVAILABLE")
                self.clearLegacyPurchaseState()
                return
            }

            SKPaymentQueue.default().add(SKPayment(product: product))
        }
    }

    public func request(_ request: SKRequest, didFailWithError error: Error) {
        DispatchQueue.main.async {
            guard let legacyRequest = self.legacyPurchaseRequest,
                  request === legacyRequest,
                  let call = self.legacyPurchaseCall else { return }
            self.legacyPurchaseTimeout?.cancel()
            call.reject("Unable to load Apple subscription product", "PRODUCT_REQUEST_FAILED", error)
            self.clearLegacyPurchaseState()
        }
    }

    public func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        DispatchQueue.main.async {
            for transaction in transactions {
                guard transaction.payment.productIdentifier == self.legacyPurchaseProductIdentifier,
                      let call = self.legacyPurchaseCall else { continue }

                switch transaction.transactionState {
                case .purchased, .restored:
                    queue.finishTransaction(transaction)
                    call.resolve([
                        "purchased": true,
                        "pending": false,
                        "productIdentifier": transaction.payment.productIdentifier,
                        "transactionId": transaction.transactionIdentifier ?? ""
                    ])
                    self.clearLegacyPurchaseState()
                case .failed:
                    queue.finishTransaction(transaction)
                    if let error = transaction.error as? SKError, error.code == .paymentCancelled {
                        call.reject("Purchase cancelled", "USER_CANCELLED", error)
                    } else if let error = transaction.error {
                        call.reject("Apple purchase failed", "PURCHASE_FAILED", error)
                    } else {
                        call.reject("Apple purchase failed", "PURCHASE_FAILED")
                    }
                    self.clearLegacyPurchaseState()
                case .deferred:
                    call.resolve([
                        "purchased": false,
                        "pending": true,
                        "productIdentifier": transaction.payment.productIdentifier
                    ])
                    self.clearLegacyPurchaseState()
                case .purchasing:
                    break
                @unknown default:
                    call.reject("Unknown Apple purchase state", "UNKNOWN_PURCHASE_STATE")
                    self.clearLegacyPurchaseState()
                }
            }
        }
    }

    private func clearLegacyPurchaseState() {
        legacyPurchaseTimeout?.cancel()
        legacyPurchaseTimeout = nil
        legacyPurchaseRequest?.delegate = nil
        legacyPurchaseRequest = nil
        legacyPurchaseCall = nil
        legacyPurchaseProductIdentifier = nil
    }
}
