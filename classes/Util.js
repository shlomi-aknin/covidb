module.exports = class Util {
    static equalArrays(first, second) {
        return this.arrayContainsArray(first, second, true);
    }

    static arrayContainsArray(superset, subset, equality = false) {
        if (equality) {
            if (superset.length !== subset.length) {
                return false;
            }
        } else {
            if (subset.length === 0 || superset.length < subset.length) {
                return false;
            }
        }
        for (var i = 0; i < subset.length; i++) {
            if (superset.indexOf(subset[i]) === -1) {
                return false;
            }
            if (equality) {
                if (superset[i] !== subset[i]) {
                    return false;
                }
            }
        }
        return true;
    }

    static isObject(obj) {
        return typeof obj === 'object' && !Array.isArray(obj);
    }
}