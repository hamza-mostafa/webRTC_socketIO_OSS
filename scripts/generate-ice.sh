#!/usr/bin/env bash
echo "Trickle ICE for local:"
cat <<EOICE
{
  "iceServers":[
    { "urls":["stun:stun.l.google.com:19302"] },
    {
      "urls":["turn:$(hostname -I | awk "{print $1}"):3478?transport=udp"],
      "username":"test",
      "credential":"pass"
    }
  ]
}
EOICE
