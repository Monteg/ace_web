interface MeetingEmail {
  eventName: string; recipient: string; name: string; company: string; email: string;
  member: string; day: string; time: string; message: string;
}

export interface MeetingEmailCopy {
  subject: string; greeting: string; request: string; name: string; company: string; email: string;
  member: string; day: string; time: string; flexible: string; topics: string; topicsFallback: string; confirm: string;
}

const englishCopy: MeetingEmailCopy = {
  subject: '{event}: meeting request from {company}',
  greeting: 'Hello Ace Games,',
  request: "I'd like to request a meeting at {event}.",
  name: 'Name', company: 'Company', email: 'Work email', member: 'Meet', day: 'Preferred day',
  time: 'Preferred time (Lisbon)', flexible: 'Flexible', topics: 'Topics to discuss',
  topicsFallback: 'Portfolio and partnership opportunities',
  confirm: 'Please confirm the time and meeting location.',
};

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/gu, (token, key) => values[key] ?? token);

export function buildMeetingEmail(meeting: MeetingEmail, copy: MeetingEmailCopy = englishCopy) {
  const variables = { event: meeting.eventName, company: meeting.company.trim() };
  const subject = fill(copy.subject, variables);
  const body = [
    copy.greeting, '', fill(copy.request, variables), '',
    `${copy.name}: ${meeting.name.trim()}`, `${copy.company}: ${meeting.company.trim()}`, `${copy.email}: ${meeting.email.trim()}`,
    `${copy.member}: ${meeting.member}`, `${copy.day}: ${meeting.day}`,
    `${copy.time}: ${meeting.time || copy.flexible}`, '',
    `${copy.topics}:`, meeting.message.trim() || copy.topicsFallback, '',
    copy.confirm,
  ].join('\n');
  return { body, href: `mailto:${meeting.recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}

export function selectMeetingMember(select: HTMLSelectElement, member: string | null) {
  if (!member || !Array.from(select.options).some(option => option.value === member)) return false;
  select.value = member;
  return true;
}
