import os


BOARD_SIZE = 15
DEFAULT_DB = os.path.expanduser("~/.games/selfplay.sqlite")
LOG_DIR = os.path.expanduser("~/.games/logs")

# 运行时只通过 --mode 选择工作流；以下固定参数直接修改常量。
WORKERS = 8
DB = DEFAULT_DB
BATCH_ID = None              # None=自动续跑匹配的未完成批次，否则新建；也可指定 batch
SAMPLE_MOVES = 4
TIME_LIMIT_MS = 5000

CONFIGS = {
    "update-elo": {
        "models": ["mix-v6-h3"],  # None=全部模型；列表=重点模型
        "games_per_pair": 1000,
        "no_self": True,
    },
    "teacher": {
        "models": ["nn-v6-full"],
        "games_per_pair": 2000,
        "no_self": False,
    },
}
