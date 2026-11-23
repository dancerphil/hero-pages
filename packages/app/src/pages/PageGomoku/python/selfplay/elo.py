import numpy as np

ELO_INIT = 1500.0


def _fit(design, games, scores):
    """Regularized Bradley–Terry fit in natural-log odds, including black advantage.

    A unit Gaussian prior keeps undefeated and disconnected models finite and
    anchors ratings at ELO_INIT. Draws contribute half a point.
    """
    parameters = np.zeros(design.shape[1])

    def loss(values):
        logits = design @ values
        return np.sum(games * np.logaddexp(0, logits) - scores * logits) + values @ values / 2

    for _ in range(100):
        logits = design @ parameters
        probabilities = np.exp(-np.logaddexp(0, -logits))
        gradient = design.T @ (games * probabilities - scores) + parameters
        if np.max(np.abs(gradient)) < 1e-7:
            return parameters
        weights = games * probabilities * (1 - probabilities)
        hessian = design.T @ (weights[:, None] * design) + np.eye(len(parameters))
        step = np.linalg.solve(hessian, gradient)
        if np.max(np.abs(step)) < 1e-8:
            return parameters
        scale = 1.0
        current = loss(parameters)
        while loss(parameters - scale * step) > current - 1e-4 * scale * (gradient @ step):
            scale /= 2
            if scale < 1e-12:
                raise RuntimeError("Elo fit line search failed")
        parameters -= scale * step
    raise RuntimeError("Elo fit did not converge")


def recompute_elo(con):
    """Rebuild ratings and cross-model statistics from all saved games.

    Self-play informs black advantage but does not count toward model W-D-L.
    Returns the fitted black advantage in Elo points.
    """
    rows = con.execute(
        "SELECT black_model, white_model, winner, COUNT(*) FROM games "
        "GROUP BY black_model, white_model, winner ORDER BY black_model, white_model, winner"
    ).fetchall()
    models = sorted({model for black, white, _, _ in rows for model in (black, white)})
    indices = {model: index for index, model in enumerate(models)}
    design = np.zeros((len(rows), len(models) + 1))
    games = np.zeros(len(rows))
    scores = np.zeros(len(rows))
    stats = {model: [0, 0, 0] for model in models}  # wins, losses, draws
    for index, (black, white, winner, count) in enumerate(rows):
        score = {"black": 1.0, "white": 0.0, "draw": 0.5}[winner]
        design[index, indices[black]] += 1
        design[index, indices[white]] -= 1
        design[index, -1] = 1
        games[index] = count
        scores[index] = count * score
        if black != white:
            stats[black][{"black": 0, "white": 1, "draw": 2}[winner]] += count
            stats[white][{"white": 0, "black": 1, "draw": 2}[winner]] += count
    fitted = _fit(design, games, scores) * (400 / np.log(10))
    con.execute("SAVEPOINT recompute_elo")
    try:
        con.execute("DELETE FROM elo_ratings")
        con.executemany(
            "INSERT INTO elo_ratings (model, rating, games, wins, losses, draws, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
            [(model, ELO_INIT + float(fitted[index]), sum(stats[model]), *stats[model])
             for index, model in enumerate(models)],
        )
    except Exception:
        con.execute("ROLLBACK TO recompute_elo")
        raise
    finally:
        con.execute("RELEASE recompute_elo")
    return float(fitted[-1])
