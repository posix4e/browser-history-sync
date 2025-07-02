//
//  ContentView.swift
//  Browser History Sync
//
//  Created for P2P browser history sync
//

import SwiftUI
import SafariServices

struct ContentView: View {
    @State private var syncKey: String = ""
    @State private var isConnected: Bool = false
    @State private var peerCount: Int = 0
    @State private var historyCount: Int = 0
    @State private var showingSafariView = false
    @State private var statusMessage: String = "Not connected"
    
    // Extension bundle identifier
    let extensionBundleIdentifier = "xyz.ttt246.holepunch-history-sync.Extension"
    
    var body: some View {
        NavigationView {
            Form {
                // Extension Status Section
                Section(header: Text("Safari Extension")) {
                    HStack {
                        Text("Extension Status")
                        Spacer()
                        Text("Check Settings")
                            .foregroundColor(.secondary)
                    }
                    
                    Button(action: openSafariSettings) {
                        Label("Open Safari Settings", systemImage: "safari")
                    }
                }
                
                // Sync Status Section
                Section(header: Text("Sync Status")) {
                    HStack {
                        Label("Connection", systemImage: "network")
                        Spacer()
                        Text(statusMessage)
                            .foregroundColor(isConnected ? .green : .secondary)
                    }
                    
                    HStack {
                        Label("Peers", systemImage: "person.2")
                        Spacer()
                        Text("\(peerCount)")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Label("History Items", systemImage: "clock")
                        Spacer()
                        Text("\(historyCount)")
                            .foregroundColor(.secondary)
                    }
                }
                
                // Sync Key Section
                Section(header: Text("Sync Key")) {
                    TextField("Enter sync key", text: $syncKey)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .font(.system(.body, design: .monospaced))
                    
                    HStack {
                        Button(action: updateSyncKey) {
                            Label("Update Key", systemImage: "key")
                        }
                        .buttonStyle(.borderedProminent)
                        
                        Spacer()
                        
                        Button(action: copySyncKey) {
                            Label("Copy", systemImage: "doc.on.doc")
                        }
                        .buttonStyle(.bordered)
                    }
                    
                    Text("Share this key with your other devices to sync history")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Actions Section
                Section {
                    Button(action: refreshStatus) {
                        Label("Refresh Status", systemImage: "arrow.clockwise")
                    }
                    
                    Button(action: clearHistory) {
                        Label("Clear History", systemImage: "trash")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Browser History Sync")
            .onAppear {
                loadSyncKey()
                refreshStatus()
                startStatusTimer()
            }
        }
    }
    
    // MARK: - Functions
    
    func openSafariSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
    
    func loadSyncKey() {
        // Load sync key from UserDefaults or generate new one
        if let savedKey = UserDefaults.standard.string(forKey: "syncKey") {
            syncKey = savedKey
        } else {
            // Generate new sync key
            let newKey = "sync-\(Date().timeIntervalSince1970)-\(UUID().uuidString.prefix(8).lowercased())"
            syncKey = newKey
            UserDefaults.standard.set(newKey, forKey: "syncKey")
        }
    }
    
    func updateSyncKey() {
        UserDefaults.standard.set(syncKey, forKey: "syncKey")
        
        // Send message to extension
        sendMessageToExtension(["type": "updateSyncKey", "syncKey": syncKey])
        
        // Show feedback
        statusMessage = "Updating..."
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            refreshStatus()
        }
    }
    
    func copySyncKey() {
        UIPasteboard.general.string = syncKey
        
        // Show feedback
        statusMessage = "Copied!"
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            refreshStatus()
        }
    }
    
    func refreshStatus() {
        // Send message to extension to get status
        sendMessageToExtension(["type": "getSyncStatus"]) { response in
            if let status = response as? [String: Any] {
                DispatchQueue.main.async {
                    self.isConnected = status["connected"] as? Bool ?? false
                    self.peerCount = status["peerCount"] as? Int ?? 0
                    self.historyCount = status["historyCount"] as? Int ?? 0
                    self.statusMessage = self.isConnected ? "Connected" : "Disconnected"
                }
            }
        }
    }
    
    func clearHistory() {
        sendMessageToExtension(["type": "clearHistory"])
        historyCount = 0
    }
    
    func sendMessageToExtension(_ message: [String: Any], completion: ((Any?) -> Void)? = nil) {
        // This would use native messaging to communicate with the Safari extension
        // For now, we'll just simulate it
        print("Sending message to extension: \(message)")
        
        // In a real implementation, this would use SFSafariApplication or similar
        completion?(nil)
    }
    
    func startStatusTimer() {
        Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { _ in
            refreshStatus()
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}