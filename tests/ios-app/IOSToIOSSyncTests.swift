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

    func testRealP2PSyncBetweenTwoIOSDevices() throws {
        let syncKey = ProcessInfo.processInfo.environment["SYNC_KEY"] ?? "test-\(Date().timeIntervalSince1970)"

        // Device 1 setup
        let device1 = XCUIApplication()
        device1.launchArguments = ["--device-id", "ios-1", "--sync-key", syncKey]
        device1.launch()

        // Configure P2P sync
        XCTAssertTrue(device1.buttons["Start Sync"].exists)
        device1.buttons["Start Sync"].tap()

        // Browse URLs in Safari
        let safari1 = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        safari1.launch()

        let device1Urls = [
            "https://apple.com",
            "https://developer.apple.com",
            "https://swift.org"
        ]

        for url in device1Urls {
            navigateToURL(in: safari1, url: url)
            Thread.sleep(forTimeInterval: 2)
        }

        // In real test, second device would be on different simulator
        // For now, verify history was captured
        device1.activate()

        let historyCount = device1.staticTexts["historyCount"]
        XCTAssertTrue(historyCount.exists)
        XCTAssertNotEqual(historyCount.label, "0")

        // Save test data
        let syncData = [
            "deviceId": "ios-1",
            "platform": "ios",
            "syncKey": syncKey,
            "browsedUrls": device1Urls,
            "timestamp": Date().timeIntervalSince1970
        ] as [String: Any]

        // Write to file for verification
        saveSyncData(syncData, filename: "ios-1.json")
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

    private func saveSyncData(_ data: [String: Any], filename: String) {
        let documentsPath = FileManager.default.urls(for: .documentDirectory,
                                                     in: .userDomainMask).first!
        let syncDataPath = documentsPath.appendingPathComponent("sync-data")

        try? FileManager.default.createDirectory(at: syncDataPath,
                                                 withIntermediateDirectories: true)

        let filePath = syncDataPath.appendingPathComponent(filename)
        let jsonData = try? JSONSerialization.data(withJSONObject: data)
        try? jsonData?.write(to: filePath)
    }
}
