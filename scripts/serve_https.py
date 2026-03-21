#!/usr/bin/env python3
import argparse
import http.server
import os
import socketserver
import ssl


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default="web/dist")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8443)
    parser.add_argument("--cert", default=".local-https/local.crt")
    parser.add_argument("--key", default=".local-https/local.key")
    args = parser.parse_args()

    directory = os.path.abspath(args.dir)
    cert = os.path.abspath(args.cert)
    key = os.path.abspath(args.key)

    handler = lambda *h_args, **h_kwargs: http.server.SimpleHTTPRequestHandler(
        *h_args,
        directory=directory,
        **h_kwargs,
    )

    class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True

    httpd = ThreadingHTTPServer((args.host, args.port), handler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=cert, keyfile=key)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

    print(f"Serving HTTPS on {args.host} port {args.port} (https://{args.host}:{args.port}/) ...")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
