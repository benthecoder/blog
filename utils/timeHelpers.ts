export const timeSince = (date: string | Date): string => {
  const now = new Date();
  const dateObject = date instanceof Date ? date : new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - dateObject.getTime()) / 1000
  );
  const days = Math.floor(diffInSeconds / (3600 * 24));
  const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);

  if (days > 1) {
    return `${days} days ago`;
  } else if (days === 1) {
    return "1 day ago";
  } else if (hours > 1) {
    return `${hours} hours ago`;
  } else if (hours === 1) {
    return "1 hour ago";
  } else if (minutes > 1) {
    return `${minutes} minutes ago`;
  } else if (minutes === 1) {
    return "1 minute ago";
  } else {
    return "less than a minute ago";
  }
};
