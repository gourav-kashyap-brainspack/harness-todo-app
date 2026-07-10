package com.todoapp

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "TodoApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * react-native-bootsplash (FND-004, FR1). The installed `react-native-screens`
   * is 4.8.0 (< 4.16.0), so this follows the library's "Screens < v4.16.0"
   * integration exactly: `init()` before `super.onCreate()`, and `super.onCreate`
   * is called with `null` rather than the real `savedInstanceState` (works
   * around a screens fragment-restoration issue on older versions) — see the
   * react-native-bootsplash README, "With bare React Native > Android".
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)
  }
}
