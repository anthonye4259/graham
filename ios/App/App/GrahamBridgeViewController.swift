import Capacitor

@objc(GrahamBridgeViewController)
class GrahamBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginType(AppleIntelligencePlugin.self)
        bridge?.registerPluginType(GrahamStoreKitPlugin.self)
    }
}
