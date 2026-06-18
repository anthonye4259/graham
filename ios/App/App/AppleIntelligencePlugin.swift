import Foundation
import Capacitor

#if canImport(FoundationModels)
import FoundationModels
#endif

@objc(AppleIntelligencePlugin)
public class AppleIntelligencePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleIntelligencePlugin"
    public let jsName = "AppleIntelligence"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkAvailability", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generateText", returnType: CAPPluginReturnPromise)
    ]
    
    @objc func checkAvailability(_ call: CAPPluginCall) {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            let model = SystemLanguageModel.default
            switch model.availability {
            case .available:
                call.resolve(["available": true])
            default:
                call.resolve(["available": false])
            }
        } else {
            call.resolve(["available": false])
        }
        #else
        call.resolve(["available": false])
        #endif
    }
    
    @objc func generateText(_ call: CAPPluginCall) {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            guard let promptText = call.getString("prompt") else {
                call.reject("Must provide a prompt")
                return
            }
            
            Task {
                do {
                    let session = LanguageModelSession()
                    let response = try await session.respond(to: promptText)
                    
                    call.resolve([
                        "text": response.content
                    ])
                } catch {
                    call.reject("Failed to generate text: \(error.localizedDescription)")
                }
            }
        } else {
            call.reject("Apple Intelligence requires iOS 26.0 or later.")
        }
        #else
        call.reject("FoundationModels framework is not available in this build environment.")
        #endif
    }
}
