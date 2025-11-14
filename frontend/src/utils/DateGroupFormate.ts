// DateGroupFormate.ts (ensure this helper exists)
export const getMessageDayLabel = (dateString: string | Date): string => {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const resetTime = (date: Date) => {
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const messageDateOnly = resetTime(new Date(messageDate));
  const todayOnly = resetTime(new Date(today));
  const yesterdayOnly = resetTime(new Date(yesterday));

  if (messageDateOnly.getTime() === todayOnly.getTime()) {
    return "Today";
  }

  if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Yesterday";
  }

  const daysDiff = Math.floor(
    (todayOnly.getTime() - messageDateOnly.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff < 7 && daysDiff > 1) {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return dayNames[messageDate.getDay()];
  }

  const day = String(messageDate.getDate()).padStart(2, "0");
  const month = String(messageDate.getMonth() + 1).padStart(2, "0");
  const year = messageDate.getFullYear();

  return `${day}-${month}-${year}`;
};

export const getDateLabelSortValue = (dateString: string | Date): number => {
  return new Date(dateString).getTime();
};
