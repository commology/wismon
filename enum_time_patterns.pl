#!/usr/bin/perl -w
use strict;
use warnings;

sub GRANULARITY_CHOICES {
    qw/MINUTE HOUR DAY MONTH/;  # /SECOND MINUTE HOUR DAY MONTH YEAR/
}

my $PATTERN_DATETIME_YEAR = qr/(?:19|20)[0-9][0-9]/;
my $PATTERN_DATETIME_MONTH = qr/1[0-2]|0?[1-9]/;
my $PATTERN_DATETIME_DAY = qr/[12][0-9]|3[01]|0?[1-9]/;
my $PATTERN_DATETIME_HOUR = qr/2[0-3]|[01]?[0-9]/;
my $PATTERN_DATETIME_MINUTE = qr/[0-5]?[0-9]/;

sub PATTERN_TIME_INPUT {
    my $granul = defined($_[0]) ? $_[0] : (&GRANULARITY_CHOICES)[0];
    
    my $pattern = '(' . $PATTERN_DATETIME_YEAR . ')';
    unless($granul eq 'YEAR') {
        $pattern .= '\D*' . '(' . $PATTERN_DATETIME_MONTH . ')';
    }
    unless($granul eq 'YEAR' || $granul eq 'MONTH') {
        $pattern .= '(?:\D*' . '(' . $PATTERN_DATETIME_DAY . '))?';
    }
    unless($granul eq 'YEAR' || $granul eq 'MONTH' || $granul eq 'DAY') {
        $pattern .= '(?:\D*' . '(' . $PATTERN_DATETIME_HOUR . '))?';
    }
    unless($granul eq 'YEAR' || $granul eq 'MONTH' || $granul eq 'DAY' || $granul eq 'HOUR') {
        $pattern .= '(?:\D*' . '(' . $PATTERN_DATETIME_MINUTE . '))?';
    }
    $pattern;
}

sub PATTERN_TIME_DELTA {
    my $pattern = '';
    $pattern .= '([\d]+)([YyMmDdWwHhIiSs])';
    
    return $pattern;
}

sub PATTERN_RESULT_DATETIME {
    '{TIME-INTERVAL}';
}