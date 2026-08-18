#!/usr/bin/env python3
import json, re, sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'seeds/manta-manabi-listings.json').read_text())
CATS={'food-shopping-dining','healthcare-insurance','housing-household-services','transport-travel-experiences'}
ALLOWED={'name','slug','category','listing_type','summary','location','search_terms','website','phone','email','source_url','registration_url','verification_method','last_verified_at','next_review_at'}
def fail(msg): raise ValueError(msg)
def url(v):
    p=urlparse(v); fail(f'bad URL: {v}') if p.scheme not in ('http','https') or not p.netloc else None
for i,x in enumerate(DATA['listings']):
    extra=set(x)-ALLOWED
    fail(f'listing {i} extra fields {extra}') if extra else None
    for k in ('name','slug','category','listing_type','summary','source_url','verification_method','last_verified_at'):
        fail(f'listing {i} missing {k}') if not isinstance(x.get(k),str) or not x[k].strip() else None
    fail(f'listing {i} category') if x['category'] not in CATS else None
    fail(f'listing {i} slug') if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',x['slug']) else None
    for k,n in [('name',160),('slug',160),('listing_type',120),('summary',500),('location',240),('search_terms',1000),('phone',80),('email',254)]:
        fail(f'listing {i} {k} too long') if len(x.get(k,''))>n else None
    for k in ('website','source_url','registration_url'):
        if k in x: url(x[k])
    for k in ('last_verified_at','next_review_at'):
        if k in x:
            try: date.fromisoformat(x[k])
            except ValueError: fail(f'listing {i} invalid {k}')
    fail('Charter contact/location conflict') if x['slug']=='charter-manta' and any(k in x for k in ('phone','email')) else None
slugs=[x['slug'] for x in DATA['listings']]
fail('duplicate slugs') if len(slugs)!=len(set(slugs)) else None
for c in DATA.get('search_cases',[]):
    fail('invalid search case') if not isinstance(c.get('query'),str) or not isinstance(c.get('expected_slugs'),list) else None
    fail('unknown expected slug') if not set(c['expected_slugs'])<=set(slugs) else None
    terms=c['query'].lower().split()
    actual=[x['slug'] for x in DATA['listings'] if all(t in (x.get('name','')+' '+x.get('search_terms','')).lower() for t in terms)]
    fail(f"search case {c['query']!r}: expected {c['expected_slugs']}, got {actual}") if actual != c['expected_slugs'] else None
print(f"validated {len(slugs)} listings and {len(DATA['search_cases'])} search cases")
