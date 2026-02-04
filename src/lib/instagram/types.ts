export type ProfileRef = {
  username: string;
  href?: string;
};

export type ParsedList = {
  items: ProfileRef[];
  sourceFile: string;
};
