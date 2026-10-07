// Redis executes this as one isolated operation. If INCR fails, remove the
// marker so a later retry can still count the visit; scripts do not roll back
// earlier writes automatically. Keys and expiry are passed separately as args.
export const COUNT_VIEW_SCRIPT = `
local fresh = redis.call("SET", KEYS[2], "1", "EX", ARGV[1], "NX")
if not fresh then
  return redis.call("GET", KEYS[1]) or "0"
end
local count = redis.pcall("INCR", KEYS[1])
if type(count) == "table" and count.err then
  redis.call("DEL", KEYS[2])
  return redis.error_reply(count.err)
end
return count
`;
