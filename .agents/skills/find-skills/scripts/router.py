#!/usr/bin/env python3
import os
import sys
import json
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILLS_JSON_PATH = os.path.join(SCRIPT_DIR, '..', 'references', 'skills_list.json')

def load_skills():
    if not os.path.exists(SKILLS_JSON_PATH):
        print(f"Error: Skills index not found at {SKILLS_JSON_PATH}", file=sys.stderr)
        return []
    try:
        with open(SKILLS_JSON_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading skills index: {e}", file=sys.stderr)
        return []

def search_skills(query, skills):
    if not query:
        return []
        
    query_tokens = [t.lower() for t in re.findall(r'\w+', query) if len(t) > 1]
    if not query_tokens:
        return []
        
    scored_results = []
    
    for skill in skills:
        score = 0
        name = skill.get('name', '').lower()
        original_name = skill.get('original_name', '').lower()
        description = skill.get('description', '').lower()
        tags = skill.get('tags', '').lower()
        when_to_use = [w.lower() for w in skill.get('when_to_use', [])]
        
        # Check exact matches
        if query.lower() == original_name or query.lower() == name:
            score += 20
            
        for token in query_tokens:
            # Match in name
            if token in original_name or token in name:
                score += 8
                
            # Match in tags
            if token in tags:
                score += 4
                
            # Match in description
            if token in description:
                score += 3
                
            # Match in when to use statements
            for w in when_to_use:
                if token in w:
                    score += 2
                    
        if score > 0:
            scored_results.append((score, skill))
            
    # Sort by score descending
    scored_results.sort(key=lambda x: x[0], reverse=True)
    return scored_results

def print_skill_details(skill, rank, score):
    original_name = skill.get('original_name', '')
    name = skill.get('name', '')
    category = skill.get('category', '')
    description = skill.get('description', '')
    when_to_use = skill.get('when_to_use', [])
    
    category_display = category.replace('-', ' ').title()
    relative_path = f"{category}/{original_name}"
    
    print(f"\n{rank}. \033[1;32m@{original_name}\033[0m (Score: {score})")
    print(f"   \033[1;34mCategory:\033[0m {category_display} (Location: {relative_path})")
    print(f"   \033[1;34mDescription:\033[0m {description}")
    if when_to_use:
        print(f"   \033[1;34mWhen to Use:\033[0m")
        for bullet in when_to_use:
            print(f"     - {bullet}")
    print(f"   \033[1;34mInvocation:\033[0m @{original_name} <task>")

def main():
    if len(sys.argv) < 2:
        print("Usage: router.py \"<search query or keyword>\"")
        sys.exit(1)
        
    query = " ".join(sys.argv[1:])
    skills = load_skills()
    
    if not skills:
        sys.exit(1)
        
    print(f"Searching {len(skills)} skills for: \"{query}\"...")
    results = search_skills(query, skills)
    
    if not results:
        print("\nNo matching skills found. Try using different keywords.")
        sys.exit(0)
        
    print(f"\nFound {len(results)} matching skills. Showing top results:")
    for rank, (score, skill) in enumerate(results[:5], 1):
        print_skill_details(skill, rank, score)
        
    if len(results) > 5:
        print(f"\n... and {len(results) - 5} more matches. Refine your query for more precise routing.")

if __name__ == '__main__':
    main()
