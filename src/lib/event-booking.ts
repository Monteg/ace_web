interface MeetingEmail {
  eventName: string; recipient: string; name: string; company: string; email: string;
  member: string; day: string; time: string; message: string;
}

export function buildMeetingEmail(meeting: MeetingEmail) {
  const subject = `${meeting.eventName}: meeting request from ${meeting.company.trim()}`;
  const body = [
    `Hello Ace Games,`, '', `I'd like to request a meeting at ${meeting.eventName}.`, '',
    `Name: ${meeting.name.trim()}`, `Company: ${meeting.company.trim()}`, `Work email: ${meeting.email.trim()}`,
    `Meet: ${meeting.member}`, `Preferred day: ${meeting.day}`,
    `Preferred time (Lisbon): ${meeting.time || 'Flexible'}`, '',
    'Topics to discuss:', meeting.message.trim() || 'Portfolio and partnership opportunities', '',
    'Please confirm the time and meeting location.',
  ].join('\n');
  return { body, href: `mailto:${meeting.recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}

export function selectMeetingMember(select: HTMLSelectElement, member: string | null) {
  if (!member || !Array.from(select.options).some(option => option.value === member)) return false;
  select.value = member;
  return true;
}
