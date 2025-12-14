"""
Unit tests for depth scoring algorithm.
"""

import pytest
from src.scoring import DepthScorer, get_species_profile, ScoreResult


def test_chipura_optimal_depth():
    """Test çipura scoring at optimal depth."""
    profile = get_species_profile("chipura")
    assert profile is not None
    
    scorer = DepthScorer(profile)
    result = scorer.score(-15.0)  # -15m (within optimal band 8-20m)
    
    assert result.score == 100.0
    assert result.zone == "optimal"
    assert any(r.type == "optimal_band" for r in result.reasons)


def test_chipura_too_shallow():
    """Test çipura scoring when too shallow."""
    profile = get_species_profile("chipura")
    scorer = DepthScorer(profile)
    result = scorer.score(-3.0)  # -3m (too shallow, optimal starts at -8m)
    
    assert result.score < 100.0
    assert result.zone == "shallow"
    assert any(r.type == "penalty" for r in result.reasons)


def test_chipura_too_deep():
    """Test çipura scoring when too deep."""
    profile = get_species_profile("chipura")
    scorer = DepthScorer(profile)
    result = scorer.score(-35.0)  # -35m (too deep, optimal ends at -20m)
    
    assert result.score < 100.0
    assert result.zone == "deep"
    assert any(r.type == "penalty" for r in result.reasons)


def test_land_returns_zero():
    """Test that land (positive depth) returns score 0."""
    profile = get_species_profile("chipura")
    scorer = DepthScorer(profile)
    result = scorer.score(5.0)  # +5m (land)
    
    assert result.score == 0.0
    assert result.zone == "land"
    assert any(r.type == "land" for r in result.reasons)


def test_levrek_shallow_preference():
    """Test levrek prefers shallower depths."""
    profile = get_species_profile("levrek")
    scorer = DepthScorer(profile)
    result = scorer.score(-8.0)  # -8m (within optimal 5-15m)
    
    assert result.score == 100.0


def test_mirmir_sandy_shallow():
    """Test mırmır prefers shallow sandy zones."""
    profile = get_species_profile("mirmir")
    scorer = DepthScorer(profile)
    result = scorer.score(-8.0)  # -8m (within optimal 5-12m)
    
    assert result.score == 100.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

