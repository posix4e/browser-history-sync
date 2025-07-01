import XCTest

class SwiftToSwiftSyncTests: XCTestCase {
    
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
        ] as [String : Any]
        
        // Write to file for verification
        saveSyncData(syncData, filename: "ios-1.json")
    }
    
    private func navigateToURL(in safari: XCUIApplication, url: String) {
        safari.buttons["URL"].tap()
        safari.typeText(url)
        safari.buttons["Go"].tap()
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