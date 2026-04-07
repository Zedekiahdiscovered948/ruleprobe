package utils

// FormatDisplayName builds a display name from parts.
func FormatDisplayName(firstName string, lastName string) string {
	return firstName + " " + lastName
}

// calculateTotal computes total with tax (unexported, camelCase).
func calculateTotal(items []float64, taxRate float64) float64 {
	total := 0.0
	for _, price := range items {
		total += price
	}
	return total * (1 + taxRate)
}
