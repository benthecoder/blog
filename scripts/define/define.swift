// Prints the macOS Dictionary entry for a word, offline. Uses the built-in
// New Oxford American Dictionary directly, so it works even when no
// dictionary is enabled in Dictionary.app. Exits 1 when there is no entry.
import CoreServices
import Foundation

// Private but long-stable DictionaryServices call; the public API only
// searches the dictionaries enabled in Dictionary.app.
@_silgen_name("DCSDictionaryCreate")
func DCSDictionaryCreate(_ url: CFURL) -> Unmanaged<DCSDictionary>?

let assets = URL(fileURLWithPath:
  "/System/Library/AssetsV2/com_apple_MobileAsset_DictionaryServices_dictionary3macOS")
let noad = (try? FileManager.default.contentsOfDirectory(
  at: assets, includingPropertiesForKeys: nil))?
  .map { $0.appendingPathComponent("AssetData/New Oxford American Dictionary.dictionary") }
  .first { FileManager.default.fileExists(atPath: $0.path) }

let word = CommandLine.arguments.dropFirst().joined(separator: " ")
let range = CFRange(location: 0, length: (word as NSString).length)
let dictionary = noad.flatMap { DCSDictionaryCreate($0 as CFURL)?.takeRetainedValue() }
guard !word.isEmpty,
  let definition = DCSCopyTextDefinition(dictionary, word as CFString, range)
else { exit(1) }
print(definition.takeRetainedValue() as NSString as String)
