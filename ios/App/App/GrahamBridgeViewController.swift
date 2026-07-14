import UIKit
import Capacitor

@objc(GrahamBridgeViewController)
class GrahamBridgeViewController: CAPBridgeViewController {
    override func instanceDescriptor() -> InstanceDescriptor {
        // App Store builds must always load the signed web bundle embedded in
        // the app, never a persisted OTA path from an earlier installation.
        UserDefaults.standard.removeObject(forKey: "serverBasePath")
        KeyValueStore.standard["serverBasePath"] = nil as String?
        return InstanceDescriptor()
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        let launchColor = UIColor(red: 250.0 / 255.0, green: 247.0 / 255.0, blue: 242.0 / 255.0, alpha: 1)
        view.backgroundColor = launchColor
        webView?.backgroundColor = launchColor
        webView?.scrollView.backgroundColor = launchColor
    }

    override func capacitorDidLoad() {
        bridge?.registerPluginType(AppleIntelligencePlugin.self)
    }
}
