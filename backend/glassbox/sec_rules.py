"""Structured SEC rule definitions for RIA compliance scanning."""

SEC_MARKETING_RULE = {
    "rule_number": "206(4)-1",
    "title": "Investment Adviser Marketing Rule",
    "act": "Investment Advisers Act of 1940",
    "effective_date": "2022-11-04",
    "categories": {
        "misleading_statements": {
            "citation": "Rule 206(4)-1(a)(1)",
            "description": (
                "An advertisement may not include any untrue statement of a material fact, "
                "or omit a material fact necessary to make the statement not misleading."
            ),
        },
        "unsubstantiated_claims": {
            "citation": "Rule 206(4)-1(a)(2)",
            "description": (
                "An advertisement may not include a material statement of fact that the adviser "
                "does not have a reasonable basis for believing it will be able to substantiate "
                "upon demand by the SEC."
            ),
        },
        "untrue_implications": {
            "citation": "Rule 206(4)-1(a)(3)",
            "description": (
                "An advertisement may not include information that would reasonably be likely "
                "to cause an untrue or misleading implication or inference."
            ),
        },
        "cherry_picked_performance": {
            "citation": "Rule 206(4)-1(a)(4)",
            "description": (
                "An advertisement may not discuss any potential benefits without providing "
                "fair and balanced treatment of any associated material risks or limitations."
            ),
        },
        "misleading_performance_reference": {
            "citation": "Rule 206(4)-1(a)(5)",
            "description": (
                "An advertisement may not include a reference to specific investment advice "
                "in a manner that is not fair and balanced."
            ),
        },
        "misleading_presentation": {
            "citation": "Rule 206(4)-1(a)(6)",
            "description": (
                "An advertisement may not include or exclude performance results, or present "
                "performance time periods, in a manner that is not fair and balanced."
            ),
        },
        "misleading_overall": {
            "citation": "Rule 206(4)-1(a)(7)",
            "description": (
                "An advertisement may not be otherwise materially misleading."
            ),
        },
        "testimonials": {
            "citation": "Rule 206(4)-1(b)",
            "description": (
                "Testimonials and endorsements are permitted but require specific disclosures "
                "including: whether the person is a client, whether compensation was provided, "
                "and material conflicts of interest."
            ),
        },
        "third_party_ratings": {
            "citation": "Rule 206(4)-1(c)",
            "description": (
                "Third-party ratings may be used only if the questionnaire/survey is not designed "
                "to produce a predetermined result, and the rating is from a legitimate source."
            ),
        },
        "performance_advertising": {
            "citation": "Rule 206(4)-1(d)",
            "description": (
                "Performance advertising must show net-of-fees performance alongside any gross "
                "performance, use the same methodology and time periods, and include appropriate "
                "disclosures about market conditions and risks."
            ),
        },
        "hypothetical_performance": {
            "citation": "Rule 206(4)-1(d)(5)",
            "description": (
                "Hypothetical performance may only be shown to audiences for whom it is relevant "
                "and must include sufficient information to enable the audience to understand "
                "the criteria and assumptions used."
            ),
        },
        "predecessor_performance": {
            "citation": "Rule 206(4)-1(d)(6)",
            "description": (
                "Predecessor performance may be shown only if the person primarily responsible "
                "for achieving the prior results manages accounts at the advertising adviser "
                "and the accounts managed are sufficiently similar."
            ),
        },
        "extracted_performance": {
            "citation": "Rule 206(4)-1(d)(3)",
            "description": (
                "Extracted performance (performance of a subset of investments) must be shown "
                "alongside the total portfolio performance or with an offer to provide it."
            ),
        },
    },
}

SEC_COMPLIANCE_RULE = {
    "rule_number": "206(4)-7",
    "title": "Compliance Programs of Investment Advisers",
    "act": "Investment Advisers Act of 1940",
    "required_policy_areas": [
        "portfolio_management",
        "trading_practices",
        "proprietary_trading",
        "accuracy_of_disclosures",
        "safeguarding_client_assets",
        "books_and_records",
        "marketing",
        "valuation",
        "privacy",
        "business_continuity",
        "code_of_ethics",
        "proxy_voting",
        "chief_compliance_officer",
        "annual_review",
    ],
    "area_descriptions": {
        "portfolio_management": "Investment process, suitability, diversification, and risk management policies",
        "trading_practices": "Best execution, soft dollars, trade allocation, and aggregation policies",
        "proprietary_trading": "Personal trading restrictions, pre-clearance, and reporting requirements",
        "accuracy_of_disclosures": "Form ADV, brochure supplements, and client reporting accuracy",
        "safeguarding_client_assets": "Custody rule compliance, safekeeping, and asset verification",
        "books_and_records": "Recordkeeping requirements under Rule 204-2 and retention schedules",
        "marketing": "Advertising review, performance presentation, and testimonial compliance",
        "valuation": "Fair valuation methodologies, pricing sources, and override procedures",
        "privacy": "Regulation S-P compliance, data protection, and breach notification",
        "business_continuity": "Disaster recovery, succession planning, and critical system redundancy",
        "code_of_ethics": "Standards of conduct, gifts, outside business activities, and political contributions",
        "proxy_voting": "Proxy voting policies, procedures, and recordkeeping (if applicable)",
        "chief_compliance_officer": "CCO designation, authority, reporting lines, and independence",
        "annual_review": "Annual compliance program review process, testing, and remediation tracking",
    },
}
