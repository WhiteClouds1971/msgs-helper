#!/usr/bin/env bash
# 把任意来源图片转成仓库约定的 webp 资源（菜单封面 / 页面内容图）。
#
# 用法:
#   prepare-image.sh <源图片> "<输出文件名，不带扩展名>" [选项]
#
# 选项:
#   -o, --out-dir <目录>   输出目录，相对仓库根或绝对路径（默认 src/assets/images/menus）
#   -q, --quality <1-100>  webp 质量（默认 82；文字/线稿类内容图建议 88）
#   -e, --max-edge <px>    长边上限，默认 1920（只缩不放）
#   -f, --force            覆盖已存在文件
#
# 例:
#   prepare-image.sh ~/Downloads/abc.jpg "大旗-夏侯渊-神速"                    # 菜单封面
#   prepare-image.sh ~/x/神速大旗.jpeg "神速大旗" -o src/assets/images/da-qi   # 页面内容图
set -euo pipefail

usage() {
  sed -n '2,14p' "$0" | sed 's/^#\{0,1\} \{0,1\}//' >&2
  exit 1
}

[ "$#" -ge 2 ] || usage
src=$1
name=$2
shift 2

force=0
max_edge=1920
quality=82
out_dir_arg=''

while [ "$#" -gt 0 ]; do
  case "$1" in
    -f|--force) force=1; shift ;;
    -o|--out-dir) [ "$#" -ge 2 ] || usage; out_dir_arg=$2; shift 2 ;;
    -q|--quality) [ "$#" -ge 2 ] || usage; quality=$2; shift 2 ;;
    -e|--max-edge) [ "$#" -ge 2 ] || usage; max_edge=$2; shift 2 ;;
    -h|--help) usage ;;
    ''|*[!0-9]*) echo "无法识别的参数: ${1}" >&2; usage ;;
    *) max_edge=$1; shift ;;
  esac
done

[ -f "$src" ] || { echo "源图片不存在: ${src}" >&2; exit 1; }
command -v cwebp >/dev/null 2>&1 || { echo "缺少 cwebp（brew install webp）" >&2; exit 1; }
case "$quality" in ''|*[!0-9]*) echo "质量必须是数字: ${quality}" >&2; exit 1 ;; esac
[ "$quality" -ge 1 ] && [ "$quality" -le 100 ] || { echo "质量需在 1-100: ${quality}" >&2; exit 1; }
case "$max_edge" in ''|*[!0-9]*) echo "长边上限必须是数字: ${max_edge}" >&2; exit 1 ;; esac

repo_root=$(cd "$(dirname "$0")/../../../.." && pwd)

if [ -n "$out_dir_arg" ]; then
  case "$out_dir_arg" in
    /*) out_dir=$out_dir_arg ;;
    *) out_dir="$repo_root/$out_dir_arg" ;;
  esac
else
  out_dir="$repo_root/src/assets/images/menus"
fi
out="$out_dir/$name.webp"

[ -d "$out_dir" ] || { echo "目录不存在: ${out_dir}（先 mkdir -p）" >&2; exit 1; }
if [ -e "$out" ] && [ "$force" -ne 1 ]; then
  echo "目标已存在: ${out}（加 -f 覆盖）" >&2
  exit 1
fi

# 只缩不放：长边超过上限才缩放
resize_args=()
wh=$(python3 -c "from PIL import Image; w,h=Image.open('$src').size; print(w,h)" 2>/dev/null || echo '')
if [ -n "$wh" ]; then
  read -r w h <<<"$wh"
  long_edge=$w
  [ "$h" -gt "$w" ] && long_edge=$h
  if [ "$long_edge" -gt "$max_edge" ]; then
    read -r nw nh <<<"$(python3 -c "w,h=$w,$h; e=min(1, $max_edge/max(w,h)); print(max(1,round(w*e)), max(1,round(h*e)))")"
    resize_args=(-resize "$nw" "$nh")
  fi
else
  echo "提示: 未找到 python3，跳过尺寸裁剪（可能出现超大图）。" >&2
fi

cwebp -quiet -q "$quality" -m 6 -sharp_yuv "${resize_args[@]+"${resize_args[@]}"}" "$src" -o "$out"

size=$(wc -c < "$out" | tr -d ' ')
dims=$(python3 -c "from PIL import Image; im=Image.open('$out'); print('%dx%d' % im.size)" 2>/dev/null || file -b "$out")
rel=${out#"$repo_root/"}

cat <<EOF
已生成: ${rel}
  体积: $((size / 1024)) KB
  像素: ${dims}
EOF

if [ "$out_dir" = "$repo_root/src/assets/images/menus" ]; then
  cat <<EOF

注册表 image.src 请写:
  src: '$rel',
EOF
else
  cat <<EOF

页面里请这样引用:
  import xxxUrl from '@/${rel#src/}'
EOF
fi

if [ "$size" -gt 600000 ]; then
  echo "提示: 体积偏大（>600KB），可调低长边上限或质量后重跑。" >&2
fi
