import Foundation
import Capacitor

// IMPORTANT: This requires building with Xcode 16 / iOS 18 SDK
// For compatibility when building on older SDKs, we use #if canImport
#if canImport(FoundationModels)
import FoundationModels
#endif

@objc(AppleIntelligencePlugin)
public class AppleIntelligencePlugin: CAPPlugin {
    
    @objc func checkAvailability(_ call: CAPPluginCall) {
        #if canImport(FoundationModels)
        if #available(iOS 18.0, *) {
            // Further checks could be added here to determine specific device capabilities,
            // such as checking for the neural engine or memory requirements.
            // For WWDC 2026, we assume the framework presence and OS version implies availability.
            call.resolve([
                "available": true
            ])
        } else {
            call.resolve([
                "available": false
            ])
        }
        #else
        call.resolve([
            "available": false
        ])
        #endif
    }
    
    @objc func generateText(_ call: CAPPluginCall) {
        #if canImport(FoundationModels)
        if #available(iOS 18.0, *) {
            guard let promptText = call.getString("prompt") else {
                call.reject("Must provide a prompt")
                return
            }
            
            // Note: AFM 3 models are accessed via the new session APIs.
            // This is a theoretical implementation based on WWDC 2026 APIs.
            Task {
                do {
                    // Initialize a session with the requested or default model
                    let session = LanguageModelSession()
                    
                    // Await the generated response
                    let response = try await session.generate(promptText)
                    
                    call.resolve([
                        "text": response.text
                    ])
                } catch {
                    call.reject("Failed to generate text: \(error.localizedDescription)")
                }
            }
        } else {
            call.reject("Apple Intelligence requires iOS 18.0 or later.")
        }
        #else
        call.reject("FoundationModels framework is not available in this build environment.")
        #endif
    }
}
