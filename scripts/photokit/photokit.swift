import AppKit
import Foundation
import Photos

// Local helper for the admin "photos from this day" panel.
//   photokit day YYYY-MM-DD <thumbDir>      -> JSON list, writes 400px thumbnails
//   photokit full <localIdentifier> <out>   -> writes a large JPEG
// stdout carries only JSON; logs go to stderr.

func fail(_ message: String) -> Never {
  print("{\"error\":\"\(message)\"}")
  exit(1)
}

func log(_ message: String) {
  FileHandle.standardError.write(Data((message + "\n").utf8))
}

func requireAccess() {
  let sem = DispatchSemaphore(value: 0)
  var status = PHAuthorizationStatus.notDetermined
  PHPhotoLibrary.requestAuthorization(for: .readWrite) { s in
    status = s
    sem.signal()
  }
  sem.wait()
  guard status == .authorized || status == .limited else {
    log("auth status \(status.rawValue)")
    fail("photos-access-denied")
  }
}

func jpeg(_ image: NSImage, quality: Double) -> Data? {
  guard let tiff = image.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff) else {
    return nil
  }
  return rep.representation(using: .jpeg, properties: [.compressionFactor: quality])
}

func render(_ asset: PHAsset, size: CGFloat, fast: Bool) -> NSImage? {
  let req = PHImageRequestOptions()
  req.isSynchronous = true
  req.deliveryMode = .highQualityFormat
  req.resizeMode = fast ? .fast : .exact
  req.isNetworkAccessAllowed = true
  var result: NSImage?
  PHImageManager.default().requestImage(
    for: asset, targetSize: CGSize(width: size, height: size), contentMode: .aspectFit,
    options: req
  ) { img, _ in result = img }
  return result
}

func safeId(_ id: String) -> String { id.replacingOccurrences(of: "/", with: "_") }

let args = CommandLine.arguments

if args.count == 4, args[1] == "day" {
  let fmt = DateFormatter()
  fmt.dateFormat = "yyyy-MM-dd"
  fmt.timeZone = .current
  guard let start = fmt.date(from: args[2]),
    let end = Calendar.current.date(byAdding: .day, value: 1, to: start)
  else { fail("bad-date") }
  let dir = URL(fileURLWithPath: args[3])
  try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)

  requireAccess()

  let opts = PHFetchOptions()
  opts.predicate = NSPredicate(
    format: "creationDate >= %@ AND creationDate < %@", start as NSDate, end as NSDate)
  opts.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: true)]
  let assets = PHAsset.fetchAssets(with: .image, options: opts)

  let timeFmt = DateFormatter()
  timeFmt.dateFormat = "HH:mm"
  timeFmt.timeZone = .current

  var out: [[String: String]] = []
  assets.enumerateObjects { asset, _, _ in
    let id = safeId(asset.localIdentifier)
    let file = dir.appendingPathComponent("\(id).jpg")
    if !FileManager.default.fileExists(atPath: file.path),
      let img = render(asset, size: 400, fast: true),
      let data = jpeg(img, quality: 0.75)
    {
      try? data.write(to: file)
    }
    out.append([
      "id": asset.localIdentifier,
      "name": PHAssetResource.assetResources(for: asset).first?.originalFilename ?? id,
      "time": asset.creationDate.map { timeFmt.string(from: $0) } ?? "",
    ])
  }
  let json = try JSONSerialization.data(withJSONObject: out)
  print(String(data: json, encoding: .utf8)!)
} else if args.count == 4, args[1] == "full" {
  requireAccess()
  guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [args[2]], options: nil).firstObject
  else { fail("not-found") }
  guard let img = render(asset, size: 3000, fast: false), let data = jpeg(img, quality: 0.9)
  else { fail("render-failed") }
  do {
    try data.write(to: URL(fileURLWithPath: args[3]))
  } catch {
    fail("write-failed")
  }
  print("{\"ok\":true}")
} else {
  log("usage: photokit day YYYY-MM-DD <thumbDir> | photokit full <id> <outFile>")
  exit(2)
}
