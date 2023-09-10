const sanitiseSingleEmail = (email: string) => {
  email = email.trim();
  if (email.includes("<") && email.includes(">")) {
    return email.split("<")[1].split(">")[0];
  }
  return email;
};

const sanitisePastedEmails = (emails: string) => {
  // the pasted emails might come from Outlook
  // if it does, sanitise them
  if (emails.includes(";")) {
    return emails
      .split(";")
      .map((email) => sanitiseSingleEmail(email))
      .join("\n");
  }

  // most likely single email
  return emails;
};

export { sanitisePastedEmails };
