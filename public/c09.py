cipherText = "olssv dvysk!"
alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]

for key in range(1, 26):

  plainText = ""

  # For each possible encryption key, decrypt the cipher text and print it with the key 
  for character in range(len(cipherText)):

    if cipherText[character] not in alphabet:
      # If the character is not a letter, add it to the plain text
      # HINT: look at line 8 for a clue for the blank
      plainText += cipherText[______]
    else:
      characterIndex = alphabet.index(cipherText[character])
      # Un-shift the character
      # The '% 26' prevents errors occuring when wrapping around the alphabet from z->a
      # HINT: For this blank, you will need the variable that changes each loop
      newCharacterIndex = (characterIndex - _____) % 26 
      # Add the new character to the plain text
      # 
      plainText += alphabet[_________]
      '''
      # USING ORD AND CHR: LEAVE UNTIL EXTENSION
      # HINT: Use ord and the key variable
      newIndex = _____ + _____
      # To loop the index from z to a
      if newIndex < ord(a):
        newIndex += 26 
      # HINT: Use chr
      plainText += _______
      '''
  # Replace the underscores with the correct variable names
  print(f"Key: {_____} | Plain Text: '{____}'")
