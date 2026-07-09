#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(GrahamStoreKitPlugin, "GrahamStoreKit",
           CAP_PLUGIN_METHOD(products, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(purchaseLegacy, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(purchase, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(restore, CAPPluginReturnPromise);
)
