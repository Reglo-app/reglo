"""Classement des textes réglementaires selon les thèmes clients (US-11) et ciblage par secteur (NAF).

Thèmes de l'US-11 : Loi Climat, CSRD, Déchets, Social. La santé-sécurité au travail est rattachée à
« Social » (proposition, à valider). Classement par expressions sur le titre normalisé : simple,
explicable et sans IA (voir data-service/docs/08-veille-reglementaire-produit.md).
"""

from __future__ import annotations

import re
import unicodedata

THEMES: dict[str, dict] = {
    "loi_climat": {
        "label": "Loi Climat",
        "patterns": [r"climat", r"resilience", r"gaz a effet de serre", r"\bges\b", r"emissions de", r"energ",
                     r"renovation", r"decret tertiaire", r"performance energetique", r"carbone", r"mobilite (durable|electrique|propre)", r"plan de mobilite", r"vehicules? (electriques?|propres|a faibles emissions)",
                     r"zones? a faibles emissions", r"artificialisation", r"chaleur renouvelable", r"photovolta"],
    },
    "csrd": {
        "label": "CSRD",
        "patterns": [r"durabilite", r"csrd", r"esrs", r"vsme", r"extra-?financ", r"taxonomie", r"devoir de vigilance",
                     r"information(s)? en matiere de durabilite", r"rapport de gestion", r"publication d'informations"],
    },
    "dechets": {
        "label": "Déchets",
        "patterns": [r"dechet", r"economie circulaire", r"emballage", r"responsabilite elargie", r"\brep\b",
                     r"recycl", r"reemploi", r"biodechet", r"filiere", r"anti-gaspillage", r"installations classees",
                     r"\bicpe\b"],
    },
    "social": {
        "label": "Social",
        "patterns": [r"code du travail", r"sante et (de la )?securite", r"securite et (de la )?sante", r"sante au travail",
                     r"conditions de travail", r"prevention des risques", r"risques professionnels", r"accidents? du travail",
                     r"maladies? professionnelles?", r"penibilite", r"formation professionnelle", r"egalite professionnelle",
                     r"travailleurs? (isoles?|detaches|exposes|de nuit)", r"exposition des travailleurs", r"harcelement",
                     r"duree du travail", r"inspection du travail", r"equipements de protection", r"amiante",
                     r"agents? (chimiques?|biologiques?|cancerogenes?)", r"risques? (chimiques?|biologiques?)",
                     r"medecine du travail", r"services? de prevention", r"handicap"],
    },
}

# Ciblage sectoriel : expression → sections NAF (niveau 1). Aucun ciblage = texte pour tous les secteurs.
NAF_RULES: list[tuple[str, list[str]]] = [
    (r"\bbtp\b|batiment|chantier|travaux publics|construction", ["F"]),
    (r"transport|routier|logistique|entreposage", ["H"]),
    (r"agricole|agriculture|exploitations? agricoles?|elevage|forestier", ["A"]),
    (r"installations classees|\bicpe\b|seveso|industriel|usine", ["C", "D", "E"]),
    (r"dechet|assainissement|depollution", ["E"]),
    (r"etablissements? de sante|medico-social|hospital|ehpad", ["Q"]),
    (r"restauration|hebergement|hotel", ["I"]),
    (r"commerce|distribution", ["G"]),
]

# Mesures nominatives publiées au JO : contiennent des noms de personnes → jamais collectées (minimisation RGPD).
PERSONAL_PATTERNS = re.compile(
    r"nomination|portant nomination|naturalisation|changement de nom|reintegration|promotion|"
    r"tableau d'avancement|admission|radiation|mutation|detachement|titularisation|dignite|legion d'honneur|"
    r"ordre national du merite|merite agricole|palmes academiques|decorations?|concours|jury|cessation de fonctions?|"
    r"delegation de signature|portant affectation|liste d'aptitude|changement de corps|attribution de la medaille|citation|elevation|maintien en activite|mise a la retraite",
)


# Textes administratifs sans intérêt pour un responsable QHSE (bruit) : jamais retenus.
NOISE_PATTERNS = re.compile(
    r"portant extension (de l'|d'un |d'une |des |d')?(avenant|accord|convention)|"
    r"habilitation des agents|extension d'avenants?|portant agrement|"
    r"repartition des voix|valeur (de service )?du point|remuneration annuelle|indemnite|traitement des fonctionnaires|"
    r"fixant le montant de la contribution|elections? professionnelles?|composition (de la|du) |"
    r"modifiant la liste des (membres|representants)|portant designation|emplois offerts|epreuves?|examens?|"
    r"droit a compensation|elections?|vote par correspondance|taxe d'apprentissage|statut particulier"
)


def normalize(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text or "")
    plain = "".join(c for c in decomposed if not unicodedata.combining(c)).lower().replace("’", "'")
    return re.sub(r"\s+", " ", plain).strip()


_COMPILED = {k: [re.compile(p) for p in v["patterns"]] for k, v in THEMES.items()}
_NAF = [(re.compile(p), sections) for p, sections in NAF_RULES]


def classify(title: str) -> list[str]:
    """Thèmes d'un texte, du plus au moins marqué (nombre d'expressions trouvées)."""
    norm = normalize(title)
    hits = {k: sum(1 for p in pats if p.search(norm)) for k, pats in _COMPILED.items()}
    return [k for k, n in sorted(hits.items(), key=lambda kv: -kv[1]) if n > 0]


def naf_scope(title: str) -> list[str]:
    norm = normalize(title)
    sections = {s for p, secs in _NAF if p.search(norm) for s in secs}
    return sorted(sections)


def is_personal(title: str) -> bool:
    return bool(PERSONAL_PATTERNS.search(normalize(title)))


def is_noise(title: str) -> bool:
    return bool(NOISE_PATTERNS.search(normalize(title)))
