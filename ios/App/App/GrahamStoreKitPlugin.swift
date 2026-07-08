import Foundation
import Capacitor
import StoreKit

@objc(GrahamStoreKitPlugin)
public class GrahamStoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GrahamStoreKitPlugin"
    public let jsName = "GrahamStoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]

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

        Task {
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
}
