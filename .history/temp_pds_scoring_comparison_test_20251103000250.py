#!/usr/bin/env python3
"""
Temporary PDS Scoring Comparison Test
====================================

This test compares how different sample PDS files score against different job postings
to verify that the scoring system is working logically.

Test Scenarios:
1. Sample PDS Lenar (HR/Computer Science) should score higher on Administrative roles
2. Sample PDS New (Education background) should score higher on Instructor roles

Expected Results:
- Sample PDS Lenar vs Administrative Officer IV: HIGH score
- Sample PDS Lenar vs Instructor positions: LOWER score  
- Sample PDS New vs Instructor positions: HIGH score
- Sample PDS New vs Administrative Officer IV: LOWER score
"""

import os
import sys
import json
import sqlite3
from typing import Dict, List, Tuple
import traceback

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from improved_pds_extractor import ImprovedPDSExtractor
from assessment_engine import UniversityAssessmentEngine
from database import DatabaseManager

class PDSScoringComparisonTest:
    def __init__(self):
        self.extractor = ImprovedPDSExtractor()
        self.db_manager = DatabaseManager()
        self.assessment_engine = UniversityAssessmentEngine(self.db_manager)
        self.sample_files_dir = "SamplePDSFiles"
        
        # Test files we'll be comparing
        self.test_files = {
            "Lenar": "Sample PDS Lenar.xlsx",
            "New": "Sample PDS New.xlsx"
        }
        
        # Job postings we'll test against
        self.test_jobs = {
            "Administrative Officer": 2,  # ID 2: Administrative Officer IV
            "Computer Studies Instructor": 5,  # ID 5: Instructor I - Computer Studies
            "Education Lecturer": 3,  # ID 3: Part-Time Lecturer - Teaching Education
            "Security Instructor": 4   # ID 4: Instructor II - Security Management
        }
    
    def extract_pds_data(self, filename: str) -> Dict:
        """Extract PDS data from Excel file"""
        filepath = os.path.join(self.sample_files_dir, filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Sample file not found: {filepath}")
        
        print(f"📄 Extracting data from: {filename}")
        result = self.extractor.extract_pds_data(filepath)
        
        if not result:
            raise Exception(f"Failed to extract from {filename}: No data returned")
        
        return result
    
    def get_job_posting_data(self, job_id: int) -> Dict:
        """Get job posting data from database"""
        conn = sqlite3.connect('resume_screening.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, position_title, department_office, education_requirements, 
                   training_requirements, experience_requirements, eligibility_requirements
            FROM lspu_job_postings 
            WHERE id = ?
        """, (job_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise Exception(f"Job posting ID {job_id} not found")
        
        return {
            'id': row[0],
            'position_title': row[1],
            'department_office': row[2],
            'education_requirements': row[3] or '',
            'training_requirements': row[4] or '',
            'experience_requirements': row[5] or '',
            'eligibility_requirements': row[6] or ''
        }
    
    def calculate_score(self, pds_data: Dict, job_data: Dict) -> Dict:
        """Calculate assessment score for PDS against job posting"""
        try:
            # Format job data for assessment engine
            lspu_job = {
                'position_title': job_data['position_title'],
                'department_office': job_data['department_office'],
                'education_requirements': job_data['education_requirements'],
                'training_requirements': job_data['training_requirements'],
                'experience_requirements': job_data['experience_requirements'],
                'eligibility_requirements': job_data['eligibility_requirements']
            }
            
            # Use assessment engine to calculate score
            assessment_result = self.assessment_engine.assess_candidate_for_lspu_job(pds_data, lspu_job)
            
            return {
                'total_score': assessment_result.get('total_score', 0),
                'education_score': assessment_result.get('education_score', 0),
                'experience_score': assessment_result.get('experience_score', 0),
                'training_score': assessment_result.get('training_score', 0),
                'eligibility_score': assessment_result.get('eligibility_score', 0),
                'assessment_details': assessment_result
            }
        except Exception as e:
            print(f"❌ Error calculating score: {str(e)}")
            traceback.print_exc()
            return {
                'total_score': 0,
                'education_score': 0,
                'experience_score': 0,
                'training_score': 0,
                'eligibility_score': 0,
                'error': str(e)
            }
    
    def analyze_pds_background(self, pds_data: Dict) -> Dict:
        """Analyze the background/expertise of a PDS"""
        analysis = {
            'education_fields': [],
            'work_experience_areas': [],
            'training_areas': [],
            'key_skills': []
        }
        
        # Analyze education
        education = pds_data.get('educational_background', {})
        if isinstance(education, dict):
            for level in ['college', 'graduate_studies', 'post_graduate']:
                if level in education and education[level]:
                    courses = education[level]
                    if isinstance(courses, list):
                        for course in courses:
                            if isinstance(course, dict) and course.get('course'):
                                analysis['education_fields'].append(course['course'])
                    elif isinstance(courses, dict) and courses.get('course'):
                        analysis['education_fields'].append(courses['course'])
        
        # Analyze work experience
        work_experience = pds_data.get('work_experience', [])
        if isinstance(work_experience, list):
            for exp in work_experience:
                if isinstance(exp, dict):
                    position = exp.get('position_title', '')
                    office = exp.get('department_office', '')
                    if position:
                        analysis['work_experience_areas'].append(position)
                    if office:
                        analysis['work_experience_areas'].append(office)
        
        # Analyze training
        learning_development = pds_data.get('learning_development', [])
        if isinstance(learning_development, list):
            for training in learning_development:
                if isinstance(training, dict):
                    title = training.get('title', '')
                    if title:
                        analysis['training_areas'].append(title)
        
        return analysis
    
    def print_pds_background_summary(self, name: str, pds_data: Dict):
        """Print a summary of PDS background"""
        analysis = self.analyze_pds_background(pds_data)
        
        print(f"\n👤 {name} PDS Background Summary:")
        print("=" * 50)
        
        if analysis['education_fields']:
            print("🎓 Education Fields:")
            for field in analysis['education_fields'][:5]:  # Show first 5
                print(f"   • {field}")
        
        if analysis['work_experience_areas']:
            print("💼 Work Experience Areas:")
            unique_areas = list(set(analysis['work_experience_areas']))
            for area in unique_areas[:5]:  # Show first 5 unique
                print(f"   • {area}")
        
        if analysis['training_areas']:
            print("📚 Training Areas:")
            for training in analysis['training_areas'][:3]:  # Show first 3
                print(f"   • {training}")
    
    def run_comparison_test(self):
        """Run the complete scoring comparison test"""
        print("🧪 PDS Scoring Logic Validation Test")
        print("=" * 60)
        print()
        
        # Extract PDS data for both samples
        pds_data = {}
        for name, filename in self.test_files.items():
            try:
                print(f"📄 Processing {name} PDS...")
                data = self.extract_pds_data(filename)
                pds_data[name] = data
                self.print_pds_background_summary(name, data)
                print()
            except Exception as e:
                print(f"❌ Failed to process {name}: {str(e)}")
                return
        
        # Get job posting data
        job_data = {}
        for job_name, job_id in self.test_jobs.items():
            try:
                job_data[job_name] = self.get_job_posting_data(job_id)
                print(f"📋 Loaded job: {job_name} (ID: {job_id})")
            except Exception as e:
                print(f"❌ Failed to load job {job_name}: {str(e)}")
                return
        
        print()
        print("🎯 Scoring Comparison Results:")
        print("=" * 60)
        
        # Create comparison matrix
        results = {}
        for pds_name, pds in pds_data.items():
            results[pds_name] = {}
            print(f"\n👤 {pds_name} PDS Scores:")
            print("-" * 40)
            
            for job_name, job in job_data.items():
                print(f"🔄 Calculating score for {job_name}...")
                score_result = self.calculate_score(pds, job)
                results[pds_name][job_name] = score_result
                
                score = score_result['total_score']
                print(f"   📊 {job_name}: {score:.1f}%")
                print(f"      └─ Education: {score_result['education_score']:.1f}% | "
                      f"Experience: {score_result['experience_score']:.1f}% | "
                      f"Training: {score_result['training_score']:.1f}% | "
                      f"Eligibility: {score_result['eligibility_score']:.1f}%")
        
        print()
        self.analyze_scoring_logic(results)
    
    def analyze_scoring_logic(self, results: Dict):
        """Analyze if the scoring logic makes sense"""
        print("🧠 Scoring Logic Analysis:")
        print("=" * 50)
        
        # Expected patterns based on backgrounds:
        # Lenar (HR/CS) should score higher on Administrative roles
        # New (Education) should score higher on Instructor/Teaching roles
        
        lenar_scores = results.get('Lenar', {})
        new_scores = results.get('New', {})
        
        if not lenar_scores or not new_scores:
            print("❌ Missing score data for analysis")
            return
        
        print("\n📈 Score Comparison Analysis:")
        
        # Compare Administrative Officer scores
        admin_lenar = lenar_scores.get('Administrative Officer', {}).get('total_score', 0)
        admin_new = new_scores.get('Administrative Officer', {}).get('total_score', 0)
        
        print(f"\n🏢 Administrative Officer IV:")
        print(f"   • Lenar (HR/CS background): {admin_lenar:.1f}%")
        print(f"   • New (Education background): {admin_new:.1f}%")
        
        if admin_lenar > admin_new:
            print("   ✅ LOGICAL: Lenar scores higher (HR background matches administrative role)")
        elif admin_new > admin_lenar:
            print("   ⚠️  UNEXPECTED: New scores higher (education background on admin role)")
        else:
            print("   📊 TIED: Both score equally")
        
        # Compare Education/Instructor scores
        instructor_jobs = ['Computer Studies Instructor', 'Education Lecturer', 'Security Instructor']
        
        print(f"\n🎓 Instructor/Teaching Positions:")
        for job_name in instructor_jobs:
            lenar_score = lenar_scores.get(job_name, {}).get('total_score', 0)
            new_score = new_scores.get(job_name, {}).get('total_score', 0)
            
            print(f"\n   📚 {job_name}:")
            print(f"      • Lenar: {lenar_score:.1f}%")
            print(f"      • New: {new_score:.1f}%")
            
            if new_score > lenar_score:
                print("      ✅ LOGICAL: New scores higher (education background)")
            elif lenar_score > new_score:
                print("      ⚠️  UNEXPECTED: Lenar scores higher on teaching role")
            else:
                print("      📊 TIED: Both score equally")
        
        # Overall assessment
        print(f"\n🎯 Overall Assessment:")
        
        # Check if Lenar is better for admin roles
        lenar_admin_advantage = admin_lenar > admin_new
        
        # Check if New is better for teaching roles
        new_teaching_advantages = sum(1 for job in instructor_jobs 
                                    if new_scores.get(job, {}).get('total_score', 0) > 
                                       lenar_scores.get(job, {}).get('total_score', 0))
        
        total_teaching_jobs = len(instructor_jobs)
        
        print(f"   • Lenar advantage in Administrative: {'✅' if lenar_admin_advantage else '❌'}")
        print(f"   • New advantage in Teaching: {new_teaching_advantages}/{total_teaching_jobs} positions")
        
        if lenar_admin_advantage and new_teaching_advantages >= 2:
            print("   🎉 SCORING LOGIC IS WORKING CORRECTLY!")
            print("      The system properly matches candidates to suitable roles.")
        elif lenar_admin_advantage or new_teaching_advantages >= 2:
            print("   ⚠️  PARTIAL LOGIC: Some expected patterns detected.")
        else:
            print("   ❌ SCORING LOGIC NEEDS REVIEW")
            print("      Candidates may not be matching expected role suitability.")
        
        print(f"\n📋 Detailed Breakdown Available Above ☝️")

def main():
    """Main test execution"""
    try:
        test = PDSScoringComparisonTest()
        test.run_comparison_test()
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        traceback.print_exc()
    
    print(f"\n🧹 Test completed - this file will be deleted after review")

if __name__ == "__main__":
    main()