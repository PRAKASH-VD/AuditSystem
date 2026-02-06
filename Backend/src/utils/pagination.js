function paginate(query, { page = 1, limit = 50 }) {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
}

module.exports = { paginate };
