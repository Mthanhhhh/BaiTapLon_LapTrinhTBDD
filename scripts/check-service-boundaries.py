"""Fail CI if an active service reads another owner schema or imports its entities."""
from pathlib import Path
import re
errors=[]
for owner in ("auth","product","order","payment"):
    for p in Path(f"services/{owner}-service/src/main/java").rglob("*.java"):
        text=p.read_text(encoding="utf-8-sig")
        for foreign in {"auth","product","order","payment"}-{owner}:
            if re.search(rf"\b{foreign}_db\s*\.",text): errors.append(f"{p}: foreign SQL {foreign}_db")
            if re.search(rf"import com\.team\.ecommerce\.{foreign}\.entity\.",text): errors.append(f"{p}: foreign entity")
if errors: raise SystemExit("\n".join(errors))
print("PASS: four service boundaries; no foreign SQL or entity imports")
