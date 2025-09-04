// Placeholder for email job processor
export const queueEmail = async (to: string, subject: string, html: string) => {
  return { to, subject, status: 'queued' };
};
