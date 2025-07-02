//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Handles native messaging between Safari extension and iOS app
//

import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    private let logger = Logger(subsystem: "com.example.BrowserHistorySync", category: "ExtensionHandler")

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem
        
        let profile: UUID?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }
        
        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }
        
        logger.info("Received message from extension: \(String(describing: message))")
        
        // Handle different message types
        if let messageDict = message as? [String: Any],
           let messageType = messageDict["type"] as? String {
            
            switch messageType {
            case "getSyncStatus":
                handleGetSyncStatus(context: context)
                
            case "updateSyncKey":
                if let syncKey = messageDict["syncKey"] as? String {
                    handleUpdateSyncKey(syncKey: syncKey, context: context)
                }
                
            case "clearHistory":
                handleClearHistory(context: context)
                
            case "p2pStatus":
                // P2P status update from extension
                logger.info("P2P status update: \(messageDict)")
                sendResponse(to: context, message: ["success": true])
                
            default:
                logger.warning("Unknown message type: \(messageType)")
                sendResponse(to: context, message: ["error": "Unknown message type"])
            }
        } else {
            // Echo message for backward compatibility
            sendResponse(to: context, message: ["echo": message ?? ""])
        }
    }
    
    private func handleGetSyncStatus(context: NSExtensionContext) {
        // In a real implementation, this would query the extension's state
        // For now, return mock data
        let status: [String: Any] = [
            "connected": false,
            "syncKey": UserDefaults.standard.string(forKey: "syncKey") ?? "",
            "peerCount": 0,
            "historyCount": 0
        ]
        
        sendResponse(to: context, message: status)
    }
    
    private func handleUpdateSyncKey(syncKey: String, context: NSExtensionContext) {
        // Store sync key
        UserDefaults.standard.set(syncKey, forKey: "syncKey")
        
        // In a real implementation, this would update the extension's sync key
        logger.info("Updated sync key: \(syncKey)")
        
        sendResponse(to: context, message: ["success": true])
    }
    
    private func handleClearHistory(context: NSExtensionContext) {
        // In a real implementation, this would clear the extension's history
        logger.info("Clearing history")
        
        sendResponse(to: context, message: ["success": true])
    }
    
    private func sendResponse(to context: NSExtensionContext, message: [String: Any]) {
        let response = NSExtensionItem()
        
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [SFExtensionMessageKey: message]
        } else {
            response.userInfo = ["message": message]
        }
        
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}