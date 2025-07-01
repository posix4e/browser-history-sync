import XCTest

class IOSToIOSSyncTests: XCTestCase {
    
    override func setUpWithError() throws {
        continueAfterFailure = false
    }
    
    func testSyncBetweenTwoIOSSimulators() throws {
        // This test requires running on two simulators
        // In CI, we'll use xcrun simctl to manage multiple simulators
        
        let app1 = XCUIApplication()
        app1.launchArguments = ["--test-mode", "--device-id", "ios-1"]
        app1.launch()
        
        // Configure with test sync key
        let syncKey = "test-ios-sync-\(Date().timeIntervalSince1970)"
        configureSyncKey(app: app1, key: syncKey)
        
        // In real implementation, we'd launch a second simulator
        // For now, we'll test the sync setup
        XCTAssertTrue(app1.staticTexts["Browser History Sync"].exists)
        XCTAssertTrue(app1.buttons["Start Sync"].exists)
        
        // Tap start sync
        app1.buttons["Start Sync"].tap()
        
        // Verify sync started
        let syncStatus = app1.staticTexts["syncStatus"]
        XCTAssertEqual(syncStatus.label, "Syncing")
    }
    
    func testHistoryCapture() throws {
        let app = XCUIApplication()
        app.launch()
        
        // Open Safari and navigate
        let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        safari.launch()
        
        // Navigate to test URLs
        navigateToURL(in: safari, url: "https://example.com")
        navigateToURL(in: safari, url: "https://example.org")
        
        // Return to our app
        app.activate()
        
        // Check history count
        let historyCount = app.staticTexts["historyCount"]
        XCTAssertTrue(historyCount.exists)
        
        // Wait for history to be captured
        let expectation = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label != '0'"),
            object: historyCount
        )
        wait(for: [expectation], timeout: 5.0)
    }
    
    private func configureSyncKey(app: XCUIApplication, key: String) {
        if app.buttons["Settings"].exists {
            app.buttons["Settings"].tap()
            app.textFields["syncKeyField"].tap()
            app.textFields["syncKeyField"].typeText(key)
            app.buttons["Save"].tap()
        }
    }
    
    private func navigateToURL(in safari: XCUIApplication, url: String) {
        safari.buttons["URL"].tap()
        safari.typeText(url)
        safari.buttons["Go"].tap()
        
        // Wait for page to load
        Thread.sleep(forTimeInterval: 2.0)
    }
}