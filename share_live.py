#!/usr/bin/env python
"""
Instant Shareable Link Generator for GreenPulse Mobile Store
Creates a public HTTPS URL using localtunnel, ngrok, or pinggy.
"""
import subprocess
import shutil
import sys
import os

def main():
    print("=" * 65)
    print("    🌿 GreenPulse Mobile Store - Live Shareable Link Generator")
    print("=" * 65)
    print("\n👉 Ensure your Django server is running (`python manage.py runserver`)")
    print("👉 Generating your secure public HTTPS link...\n")

    # Method 1: LocalTunnel via npx (Zero setup)
    if shutil.which("npx"):
        print("🔗 Launching LocalTunnel...")
        try:
            subprocess.run(["npx", "-y", "localtunnel", "--port", "8000"])
            return
        except KeyboardInterrupt:
            print("\nTunnel closed.")
            return
        except Exception:
            pass

    # Method 2: Ngrok (if installed)
    if shutil.which("ngrok"):
        print("🔗 Launching Ngrok...")
        try:
            subprocess.run(["ngrok", "http", "8000"])
            return
        except KeyboardInterrupt:
            print("\nTunnel closed.")
            return
        except Exception:
            pass

    # Method 3: Pinggy via SSH (Zero install)
    if shutil.which("ssh"):
        print("🔗 Launching Pinggy SSH Tunnel...")
        try:
            subprocess.run(["ssh", "-p", "443", "-R0:localhost:8000", "a.pinggy.io"])
            return
        except KeyboardInterrupt:
            print("\nTunnel closed.")
            return
        except Exception:
            pass

    print("⚠️ Please run one of the following commands to generate a public link:")
    print("   npx -y localtunnel --port 8000")
    print("   ngrok http 8000")

if __name__ == '__main__':
    main()
