const fs = require('fs');
let file = fs.readFileSync('src/app/(root)/add-clothes/batch-scan.tsx', 'utf8');

const brandAndRating = `              {/* 3. Brand */}
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Brand</Text>
                <View style={styles.formValueContainer}>
                  <Text style={styles.formValue} numberOfLines={1} ellipsizeMode="tail">
                    {item.data?.brand || "—"}
                  </Text>
                  <IconChevronDown size={16} color="#9CA3AF" />
                </View>
              </View>
              {/* 3.5 Rating */}
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Rating</Text>
                <View style={styles.formValueContainer}>
                  <Text style={styles.formValue}>
                    {item.data?.rating ? "⭐".repeat(item.data.rating) : "⭐⭐⭐⭐⭐"}
                  </Text>
                  <IconChevronDown size={16} color="#9CA3AF" />
                </View>
              </View>
              {/* 4. Color */}`;

file = file.replace('{/* 3. Color */}', brandAndRating);
fs.writeFileSync('src/app/(root)/add-clothes/batch-scan.tsx', file);
console.log('Patched batch-scan.tsx');
