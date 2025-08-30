cd CivetWeb
start CivetWeb64.exe -listening_ports 5000 -document_root ../data/ -extra_mime_types ".wasm=application/wasm,.mjs=application/javascript,.map=application/json"
start "" http://localhost:5000?coop=1
