# Bsky Follow Yourself

A tool to follow yourself on Bluesky. Lead by example - if you don't follow yourself, why should others?

## Features
- Follow/unfollow yourself on Bluesky
- Optional: Follow @benedikt.phd
- Interactive command-line interface
- Success/error reporting for each action

## Web Version
Try it online at [follow-yourself.benedikt.phd](https://follow-yourself.benedikt.phd) — sign in with Bluesky via OAuth, no app password needed.

## CLI Version
### Requirements
- Python 3.7+
- `atproto` library: `pip install atproto`

### Usage
1. Get your app password from [Bluesky settings](https://bsky.app/settings/app-passwords)
2. Run: `python follow_yourself.py`
3. Enter your username (e.g., username.bsky.social) and app password
4. Follow the prompts

## License
MIT License
