export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export const getPagination = ({ page = 1, limit = 10 }: PaginationOptions) => {
  const skip = (page - 1) * limit;
  return { skip, limit };
};
