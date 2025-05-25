export const localIce = (user, pass) => [{
  urls: ["stun:stun.l.google.com:19302",
         "turn:turn.local:3478?transport=udp"],
  username: user,
  credential: pass
}];

export const kinesisIce = (channelArn, region) => ({
  // TODO: fetch endpoints using AWS SDK
});
