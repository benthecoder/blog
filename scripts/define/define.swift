// Prints a word's entry from the Mac's built-in Oxford dictionary, or with
// --thesaurus from the Oxford American Writer's Thesaurus, offline. Opens the
// bundle directly, so it works even when no dictionary is enabled in
// Dictionary.app. Exits 1 when there is no entry.
import CoreServices
import Foundation

// Private but long-stable DictionaryServices call; the public API only
// searches the dictionaries enabled in Dictionary.app.
@_silgen_name("DCSDictionaryCreate")
func DCSDictionaryCreate(_ url: CFURL) -> Unmanaged<DCSDictionary>?

var args = Array(CommandLine.arguments.dropFirst())
let thesaurus = args.first == "--thesaurus"
if thesaurus { args.removeFirst() }
let bundle = thesaurus
  ? "Oxford American Writer's Thesaurus.dictionary"
  : "New Oxford American Dictionary.dictionary"

let assets = URL(fileURLWithPath:
  "/System/Library/AssetsV2/com_apple_MobileAsset_DictionaryServices_dictionary3macOS")
let book = (try? FileManager.default.contentsOfDirectory(
  at: assets, includingPropertiesForKeys: nil))?
  .map { $0.appendingPathComponent("AssetData/\(bundle)") }
  .first { FileManager.default.fileExists(atPath: $0.path) }

let word = args.joined(separator: " ")
let range = CFRange(location: 0, length: (word as NSString).length)
let dictionary = book.flatMap { DCSDictionaryCreate($0 as CFURL)?.takeRetainedValue() }
guard !word.isEmpty,
  let definition = DCSCopyTextDefinition(dictionary, word as CFString, range)
else { exit(1) }
print(definition.takeRetainedValue() as NSString as String)
