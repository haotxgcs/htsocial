function getFriendStatus(viewer, target) {
  if (!viewer || !target) return "none";

  const vId = viewer._id.toString();
  const tId = target._id.toString();

  if (vId === tId) return "self";
  if (viewer.friends?.some(id => id.toString() === tId)) return "friends";
  if (viewer.requestSent?.some(id => id.toString() === tId)) return "sent";
  if (viewer.requestReceived?.some(id => id.toString() === tId)) return "received";

  return "none";
}

module.exports = { getFriendStatus };
