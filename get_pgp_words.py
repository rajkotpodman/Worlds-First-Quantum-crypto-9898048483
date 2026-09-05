import urllib.request
try:
    url = "https://raw.githubusercontent.com/singpolyma/pgp-wordlist/master/pgp_words.txt"
    # Actually I can just write a quick python script to get it from a reliable source or just use a standard one.
    # Wikipedia has it: https://en.wikipedia.org/wiki/PGP_word_list
    with urllib.request.urlopen(url, timeout=5) as response:
        words = response.read().decode('utf-8')
        with open("words.txt", "w", encoding="utf-8") as f:
            f.write(words)
except Exception as e:
    print(f"Notice: Could not fetch PGP wordlist remotely ({e}). Using existing words.txt if available.")
