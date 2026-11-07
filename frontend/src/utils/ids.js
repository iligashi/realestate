// MongoDB documents arrive with `_id`, sometimes `id`, or as a bare id string
// when not populated. Compare them safely: two missing ids are NOT equal.
export const idOf = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  const id = value._id ?? value.id;
  return id ? String(id) : null;
};

export const sameId = (a, b) => {
  const left = idOf(a);
  return left !== null && left === idOf(b);
};
