#!/bin/sh
set -eu
umask 077

SCRIPT_DIR=${0%/*}
[ "$SCRIPT_DIR" = "$0" ] && SCRIPT_DIR=.
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
POCKETBASE_DIR=$ROOT_DIR/pocketbase

IFS= read -r VERSION < "$POCKETBASE_DIR/VERSION"
case "$VERSION" in
	''|*[!0-9.]*)
		echo "Invalid PocketBase version: $VERSION" >&2
		exit 1
		;;
esac

case "$(uname -s)" in
	Darwin) OS=darwin ;;
	Linux) OS=linux ;;
	*)
		echo "Unsupported operating system: $(uname -s)" >&2
		exit 1
		;;
esac

case "$(uname -m)" in
	x86_64|amd64) ARCH=amd64 ;;
	aarch64|arm64) ARCH=arm64 ;;
	*)
		echo "Unsupported architecture: $(uname -m)" >&2
		exit 1
		;;
esac

ASSET="pocketbase_${VERSION}_${OS}_${ARCH}.zip"
BASE_URL="https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}"
TMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/pocketbase-install.XXXXXX")
ZIP_FILE="$TMP_DIR/$ASSET"
CHECKSUM_FILE="$TMP_DIR/checksums.txt"

cleanup() {
	rm -rf "$TMP_DIR"
}
trap cleanup 0 1 2 3 15

curl --fail --location --silent --show-error --retry 3 \
	--output "$ZIP_FILE" "$BASE_URL/$ASSET"
curl --fail --location --silent --show-error --retry 3 \
	--output "$CHECKSUM_FILE" "$BASE_URL/checksums.txt"

EXPECTED_CHECKSUM=
while IFS=' ' read -r CHECKSUM FILE _; do
	if [ "${FILE:-}" = "$ASSET" ]; then
		EXPECTED_CHECKSUM=$CHECKSUM
	fi
done < "$CHECKSUM_FILE"

if [ -z "$EXPECTED_CHECKSUM" ]; then
	echo "No checksum found for $ASSET" >&2
	exit 1
fi

ACTUAL_CHECKSUM=$(shasum -a 256 "$ZIP_FILE")
ACTUAL_CHECKSUM=${ACTUAL_CHECKSUM%% *}
if [ "$ACTUAL_CHECKSUM" != "$EXPECTED_CHECKSUM" ]; then
	echo "Checksum mismatch for $ASSET" >&2
	exit 1
fi

unzip -o "$ZIP_FILE" pocketbase -d "$POCKETBASE_DIR" >/dev/null

if [ ! -x "$POCKETBASE_DIR/pocketbase" ]; then
	echo "PocketBase executable was not extracted" >&2
	exit 1
fi

"$POCKETBASE_DIR/pocketbase" --version
