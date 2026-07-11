import Capacitor

@objc(GrahamBridgeViewController)
class GrahamBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginType(AppleIntelligencePlugin.self)
    }
}
