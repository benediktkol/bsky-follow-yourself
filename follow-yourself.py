from atproto import Client

def self_follow(username, app_password):
    """Follow your own account on Bluesky
    Args:
        username (str): Your Bluesky username (e.g., username.bsky.social)
        app_password (str): Your Bluesky app password (Generated from Bluesky's settings page https://bsky.app/settings/app-passwords)
    Returns:
        str: Success/error message
    """
    client = Client()
    try:
        profile = client.login(username, app_password)
        response = client.follow(profile.did)
        return "Successfully followed yourself!"
    except Exception as e:
        return f"An error occurred: {e}"

def self_unfollow(username, app_password):
    """Unfollow your own account on Bluesky
    Args:
        username (str): Your Bluesky username
        app_password (str): Your Bluesky app password
    Returns:
        str: Success/error message
    """
    client = Client()
    try:
        # to unfollow an account you need the uri
        # the best way to get the uri is to simply follow the account (it's ok to follow it again)
        profile = client.login(username, app_password)
        response = client.follow(profile.did)
        client.unfollow(response.uri)
        return "Successfully unfollowed yourself!"
    except Exception as e:
        return f"An error occurred: {e}"

def follow_user(username, app_password, target_did):
    """Follow a specific user by their DID
    Args:
        username (str): Your Bluesky username
        app_password (str): Your Bluesky app password
        target_did (str): DID of the user to follow
    Returns:
        str: Success/error message
    """
    client = Client()
    try:
        profile = client.login(username, app_password)
        response = client.follow(target_did)
        return "Successfully followed @benedikt.phd!"
    except Exception as e:
        return f"An error occurred: {e}"

def get_yes_no_input(prompt):
    """Get a yes/no input from user, keep asking until valid
    Args:
        prompt (str): Question to ask user
    Returns:
        bool: True if yes, False if no
    """
    while True:
        response = input(prompt).lower()
        if response in ['yes', 'y']:
            return True
        elif response in ['no', 'n']:
            return False
        print("Please answer 'yes'/'y' or 'no'/'n'")

if __name__ == "__main__":
    # Get user login credentials
    username = input("Enter your username (example: username.bsky.social): ")
    app_password = input("Enter your app password: ")
    
    # Handle self-follow request
    if get_yes_no_input("Do you want to follow yourself? (yes/no): "):
        result = self_follow(username, app_password)
        print(result)
    
    # Handle self-unfollow request
    if get_yes_no_input("Do you want to unfollow yourself? (yes/no): "):
        result = self_unfollow(username, app_password)
        print(result)
    
    # Handle following @benedikt.phd
    if get_yes_no_input("Do you want to follow @benedikt.phd? (yes/no): "):
        result = follow_user(username, app_password, "did:plc:6dvollmohijzopc5qoi7z2rt")
        print(result)
    
    print("Script completed!")