#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import "RNBootSplash.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"TodoApp";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// react-native-bootsplash (FND-004, FR1). Verified against
// `RCTRootViewFactory.mm` (node_modules/react-native/Libraries/AppDelegate/)
// that `customizeRootView:` fires for both the bridgeless AND the bridge-
// based root-view-creation path — this app's `newArchEnabled=false`
// (stack.md), so it's the bridge-based path, but the hook is unconditional
// either way. This is the pre-RN-0.80 Objective-C `RCTAppDelegate` subclass
// form (matches the library's own README at the 4.7.5/5.5.0 tags — the
// current README only documents the newer Swift `customize(_:)` override,
// added once RN's community template moved to Swift); `initWithStoryboard:
// rootView:` is the same call either way.
- (void)customizeRootView:(RCTRootView *)rootView
{
  [RNBootSplash initWithStoryboard:@"BootSplash" rootView:rootView];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
